package com.x.base.core.project.http;

import com.x.base.core.project.gson.GsonRecord;

public class WrapOutCount implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Long count;

	public WrapOutCount() {
	}

	public WrapOutCount(Long count) {
		this.count = count;
	}

	public Long getCount() {
		return count;
	}

	public void setCount(Long count) {
		this.count = count;
	}
}
