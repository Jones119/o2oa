package com.x.base.core.project.jaxrs;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public record WrapNumberList(List<Number> valueList) implements GsonRecord {

    public WrapNumberList {
        if (valueList == null) {
            valueList = new ArrayList<>();
        }
    }

    public WrapNumberList() {
        this(new ArrayList<>());
    }

    public WrapNumberList(Collection<Number> collection) {
        this(new ArrayList<>(collection));
    }
}
