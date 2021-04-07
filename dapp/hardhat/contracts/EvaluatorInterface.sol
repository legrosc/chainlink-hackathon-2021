// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface EvaluatorInterface {
    function requestWeather(
        address policyHolderId,
        int256 _start,
        int256 _lon,
        int256 _lat
    ) external;
}
