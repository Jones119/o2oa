package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public class WrapLong implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Long value;

	public WrapLong() {
	}

	public WrapLong(Long value) {
		this.value = value;
	}

	public Long getValue() {
		return value;
	}

	public void setValue(Long value) {
		this.value = value;
	}
}
