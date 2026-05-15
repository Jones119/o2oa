package com.x.base.core.project.jaxrs;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public record WrapBooleanList(List<Boolean> valueList) implements GsonRecord {

    public WrapBooleanList {
        if (valueList == null) {
            valueList = new ArrayList<>();
        }
    }

    public WrapBooleanList() {
        this(new ArrayList<>());
    }

    public WrapBooleanList(Collection<Boolean> collection) {
        this(new ArrayList<>(collection));
    }
}
