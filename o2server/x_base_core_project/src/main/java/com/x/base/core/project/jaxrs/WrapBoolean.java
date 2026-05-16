package com.x.base.core.project.jaxrs;

import com.x.base.core.project.gson.GsonRecord;

import io.swagger.v3.oas.annotations.media.Schema;

public class WrapBoolean implements GsonRecord {

	private static final long serialVersionUID = 1L;

	@Schema(description = "布尔值.")
	protected Boolean value;

	public WrapBoolean() {
	}

	public WrapBoolean(Boolean value) {
		this.value = value;
	}

	public Boolean getValue() {
		return value;
	}

	public void setValue(Boolean value) {
		this.value = value;
	}
}
