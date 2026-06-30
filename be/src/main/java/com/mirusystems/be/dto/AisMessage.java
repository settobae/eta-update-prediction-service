package com.mirusystems.be.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AisMessage {
    public String MessageType;
    public MetaData MetaData;
    public MessageBody Message;
}