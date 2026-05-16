package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public class WrapCount implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Long count;

	public WrapCount() {
	}

	public WrapCount(Long count) {
		this.count = count;
	}

	public Long getCount() {
		return count;
	}

	public void setCount(Long count) {
		this.count = count;
	}
}
