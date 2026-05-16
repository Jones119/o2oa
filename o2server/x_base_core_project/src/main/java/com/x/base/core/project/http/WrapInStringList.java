package com.x.base.core.project.http;

import java.util.ArrayList;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public record WrapInStringList(List<String> valueList) implements GsonRecord {

    public WrapInStringList {
        if (valueList == null) {
            valueList = new ArrayList<>();
        }
    }

    public WrapInStringList() {
        this(new ArrayList<>());
    }
}
