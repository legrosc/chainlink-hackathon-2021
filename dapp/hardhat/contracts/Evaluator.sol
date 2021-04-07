// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@chainlink/contracts/src/v0.7/ChainlinkClient.sol";

contract Evaluator is ChainlinkClient {
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    mapping(bytes32 => address) public requests;
    mapping(address => uint256) public results;

    event ReceivedWeatherEvent(uint256 weather, address policyHolder);

    /**
     * Network: Kovan
     * Oracle:
     *      Name:           Alpha Chain - Kovan
     *      Listing URL:    https://market.link/nodes/ef076e87-49f4-486b-9878-c4806781c7a0?start=1614168653&end=1614773453
     *      Address:        0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b
     * Job:
     *      Name:           OpenWeather Data
     *      Listing URL:    https://market.link/jobs/e10388e6-1a8a-4ff5-bad6-dd930049a65f
     *      ID:             235f8b1eeb364efc83c26d0bef2d0c01
     *      Fee:            0.1 LINK
     */
    constructor() public {
        setPublicChainlinkToken();
        oracle = 0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b;
        jobId = "235f8b1eeb364efc83c26d0bef2d0c01";
        fee = 0.1 * 10**18;
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
        Chainlink.add(req, "start", _start);
        Chainlink.add(req, "lon", _lon);
        Chainlink.add(req, "lat", _lat);
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
        address policyHolderAddress = requestMapping[_requestId];
        results[policyHolderAddress] = _result;
        delete requestMapping[_requestId];
        emit ReceivedWeatherEvent(_result, policyHolderAddress);
    }

    modifier onlyOracle() {
        require(
            msg.sender == oracle,
            "You are not authorized to call this function."
        );
        _;
    }
}
