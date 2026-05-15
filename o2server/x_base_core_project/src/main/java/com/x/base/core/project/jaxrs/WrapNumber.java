package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

public class WrapNumber implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Number value;

	public WrapNumber() {
	}

	public WrapNumber(Number value) {
		this.value = value;
	}

	public Number getValue() {
		return value;
	}

	public void setValue(Number value) {
		this.value = value;
	}
}
