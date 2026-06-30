package com.mirusystems.be.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ShipStaticData {
    public String Destination;
    public Object Eta;
    public String CallSign;
    public String Name;
    public long UserID;
}