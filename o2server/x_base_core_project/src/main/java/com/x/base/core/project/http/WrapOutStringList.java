package com.x.base.core.project.http;

import java.util.ArrayList;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public record WrapOutStringList(List<String> valueList) implements GsonRecord {

    public WrapOutStringList {
        if (valueList == null) {
            valueList = new ArrayList<>();
        }
    }

    public WrapOutStringList() {
        this(new ArrayList<>());
    }
}
