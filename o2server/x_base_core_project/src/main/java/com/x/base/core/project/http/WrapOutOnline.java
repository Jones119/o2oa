package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public record WrapOutOnline(String person, String onlineStatus) implements GsonRecord {

    public WrapOutOnline {
    }

    public WrapOutOnline() {
        this(null, null);
    }

    public static final String status_online = "online";
    public static final String status_offline = "offline";
}
