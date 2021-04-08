// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "hardhat/console.sol";

import "@chainlink/contracts/src/v0.8/dev/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Handle insurance deposits and payements for the HedgeMe service.
contract HedgeMe is Ownable, ChainlinkClient {
    // Max duration of the insurance in days
    uint256 immutable maxDuration;
    // Minimum ether value required to register to the insurance
    uint256 immutable minEthValue;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    mapping(bytes32 => address) public requests;
    mapping(address => int256) public results;

    enum Weather {Drought, Frost}

    struct PolicyHolder {
        uint256 start;
        uint256 duration;
        uint256 amount;
        int256 latitude;
        int256 longitude;
        Weather weather;
    }

    mapping(address => PolicyHolder) public holders;
    address[] private holderAddresses;

    event InsuranceFundsUpdated(uint256 newFund);

    constructor(uint256 _maxDuration, uint256 _minEthValue) {
        maxDuration = _maxDuration;
        minEthValue = _minEthValue;

        setPublicChainlinkToken();
        fee = 0.1 * 10**18;
    }

    function setOracleAddress(address _oracle, bytes32 _jobId)
        public
        onlyOwner
    {
        oracle = _oracle;
        jobId = _jobId;
    }

    function register(uint256 amount, PolicyHolder calldata policyHolder)
        external
        payable
    {
        // Check that the right value was sent
        require(msg.value == amount, "The wrong amount was sent.");
        // Check that the sent value is valid
        require(msg.value >= minEthValue, "At least 0.001 ether must be sent.");
        // Check that the duration is valid
        require(
            policyHolder.duration <= maxDuration * 1 days,
            "The duration is too long."
        );

        holders[msg.sender] = policyHolder;
        holderAddresses.push(msg.sender);

        emit InsuranceFundsUpdated(address(this).balance);
    }

    function needsInsurance(address policyHolderAddress)
        private
        view
        returns (bool needsInsurance_)
    {
        PolicyHolder storage policyHolder = holders[policyHolderAddress];
        // TODO: parse result ?
        int256 temp = results[policyHolderAddress];
        return
            (policyHolder.weather == Weather.Drought && temp > 50) ||
            (policyHolder.weather == Weather.Frost && temp < 0);
    }

    /**
     * Initial request
     */
    function requestWeather(
        address policyHolderId,
        int256 _start,
        int256 _lon,
        int256 _lat
    ) public {
        Chainlink.Request memory req =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.fulfillWeather.selector
            );
        Chainlink.addInt(req, "start", _start);
        Chainlink.addInt(req, "lon", _lon);
        Chainlink.addInt(req, "lat", _lat);
        bytes32 requestId = sendChainlinkRequestTo(oracle, req, fee);
        requests[requestId] = policyHolderId;
    }

    /**
     * Callback function
     */
    function fulfillWeather(bytes32 _requestId, int256 _result)
        public
        recordChainlinkFulfillment(_requestId)
        onlyOracle
    {
        address policyHolderAddress = requests[_requestId];
        results[policyHolderAddress] = _result;
        delete requests[_requestId];

        // Check if the policyHolder needs insurance
        // For now let's say insurance == 1 eth
        uint256 insurance = 1 ether;
        if (needsInsurance(policyHolderAddress)) {
            payable(policyHolderAddress).transfer(insurance);
        }
    }

    modifier onlyOracle() {
        require(
            msg.sender == oracle,
            "You are not authorized to call this function."
        );
        _;
    }
}
