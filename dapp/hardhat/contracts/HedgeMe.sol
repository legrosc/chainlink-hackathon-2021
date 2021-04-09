// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "hardhat/console.sol";

import "@chainlink/contracts/src/v0.8/dev/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Handle insurance deposits and payements for the HedgeMe service.
contract HedgeMe is Ownable, ChainlinkClient {
    // Minimum ether value (in wei) required to register to the insurance
    uint256 immutable minEthValue;
    // Minimum number of days that needs to be at the specified temperature for the insurance to trigger
    uint256 immutable minDaysValue;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    mapping(bytes32 => address) public requests;
    mapping(address => uint256) public results;

    enum Weather {Frost, Drought}

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
    event PaidInsurance(address to, uint256 amount);

    constructor(uint256 _minEthValue, address _link) {
        minEthValue = _minEthValue;
        minDaysValue = 4;

        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
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
        require(msg.value >= minEthValue, "Not enough Ether provided.");

        holders[msg.sender] = policyHolder;
        holderAddresses.push(msg.sender);

        emit InsuranceFundsUpdated(address(this).balance);
    }

    // Returns the number of days where the payement of insurance is needed
    function needsInsurance(address policyHolderAddress)
        private
        view
        returns (uint256 needsInsuranceDaysCount_)
    {
        PolicyHolder storage policyHolder = holders[policyHolderAddress];
        uint256 temp = results[policyHolderAddress];
        uint256[] memory daysTemp = parseLastSevenDaysTemperatures(temp);
        uint256 daysCount = 0;

        for (uint256 i = 0; i < 7; i++) {
            // 323K =~ 50°C
            // 273K =~ 0°C
            if (
                (policyHolder.weather == Weather.Drought &&
                    daysTemp[i] > 323) ||
                (policyHolder.weather == Weather.Frost && daysTemp[i] < 273)
            ) {
                daysCount++;
            }
        }

        console.log("Number of days where insurance is needed: %s", daysCount);
        return daysCount;
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
        console.log("Sending weather request to Oracle...");
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
    function fulfillWeather(bytes32 _requestId, uint256 _result)
        public
        recordChainlinkFulfillment(_requestId)
        onlyOracle
    {
        console.log("Receiving the request result...");
        address policyHolderAddress = requests[_requestId];
        results[policyHolderAddress] = _result;
        delete requests[_requestId];

        // Check if the policyHolder needs insurance
        // For now let's say dailyAmount == 1 eth
        uint256 dailyAmount = 1 ether;
        uint256 insuranceNeededDaysCount = needsInsurance(policyHolderAddress);
        if (insuranceNeededDaysCount > 0) {
            uint256 insurance = dailyAmount * insuranceNeededDaysCount;
            payable(policyHolderAddress).transfer(insurance);
            emit PaidInsurance(policyHolderAddress, insurance);
        }
    }

    modifier onlyOracle() {
        require(
            msg.sender == oracle,
            "You are not authorized to call this function."
        );
        _;
    }

    function parseLastSevenDaysTemperatures(uint256 value)
        public
        pure
        returns (uint256[] memory)
    {
        uint256 divider = 1;
        uint256[] memory daysTemp = new uint256[](7);
        for (uint256 i = 0; i < 7; i++) {
            daysTemp[i] = (value / divider) % 1000;
            divider *= 1000;
        }
        return daysTemp;
    }
}
