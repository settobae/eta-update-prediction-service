package com.mirusystems.be.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class MessageBody {
    public PositionReport PositionReport;
    public ShipStaticData ShipStaticData;
}