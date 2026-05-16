package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public record WoTemporaryRedirect(String url) implements GsonRecord {

    public WoTemporaryRedirect {
    }

    public WoTemporaryRedirect() {
        this(null);
    }
}
