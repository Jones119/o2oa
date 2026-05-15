package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WoContentType(String contentType, Object body) implements GsonRecord {

    public WoContentType {
    }

    public WoContentType() {
        this(null, null);
    }
}
