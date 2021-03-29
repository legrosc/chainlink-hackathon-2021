// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "hardhat/console.sol";

/// @title Handle subscriptions to the Insurpool service
contract InsurpoolSubscription {
    // Max duration of the insurance in days
    uint256 immutable maxDuration;
    // Minimum ether value required to register to the insurance
    uint256 immutable minEthValue;

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

        emit InsuranceFundsUpdated(address(this).balance + msg.value);
    }

    function checkInsurancePayout() external {
        bool[] memory needInsuranceResults = new bool[](holderAddresses.length);
        uint256 needInsuranceCount = 0;
        for (uint256 i = 0; i < holderAddresses.length; i++) {
            bool _needsInsurance = needsInsurance(holderAddresses[i]);
            if (_needsInsurance == true) {
                needInsuranceCount++;
            }
            needInsuranceResults[i] = _needsInsurance;
        }

        // Get the value to give to each policy holder
        uint256 insurance = address(this).balance / needInsuranceCount;

        for (uint256 i = 0; i < holderAddresses.length; i++) {
            if (needInsuranceResults[i] == true) {
                payable(holderAddresses[i]).transfer(insurance);
            }
        }
    }

    function needsInsurance(address policyHolderAddress)
        private
        view
        returns (bool needsInsurance_)
    {
        PolicyHolder storage policyHolder = holders[policyHolderAddress];
        return policyHolder.weather == Weather.Drought;
    }
}
