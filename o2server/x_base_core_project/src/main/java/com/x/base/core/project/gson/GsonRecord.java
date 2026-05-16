package com.x.base.core.project.gson;

import java.io.Serializable;

public interface GsonRecord extends Serializable {

    default String toJsonString() {
        try {
            return XGsonBuilder.toJson(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
