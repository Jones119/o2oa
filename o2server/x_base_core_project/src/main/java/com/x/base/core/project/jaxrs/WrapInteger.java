package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public class WrapInteger implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Integer value;

	public WrapInteger() {
	}

	public WrapInteger(Integer value) {
		this.value = value;
	}

	public Integer getValue() {
		return value;
	}

	public void setValue(Integer value) {
		this.value = value;
	}
}
