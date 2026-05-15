package com.x.base.core.project.jaxrs;

import java.util.Date;

import com.x.base.core.project.gson.GsonRecord;

public record WrapDate(Date date) implements GsonRecord {

    public WrapDate {
    }

    public WrapDate() {
        this(null);
    }
}
