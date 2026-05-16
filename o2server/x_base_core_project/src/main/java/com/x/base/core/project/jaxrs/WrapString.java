package com.x.base.core.project.jaxrs;

import java.util.Objects;

import com.x.base.core.project.gson.GsonRecord;

import io.swagger.v3.oas.annotations.media.Schema;

public class WrapString implements GsonRecord {

	private static final long serialVersionUID = 1L;

	@Schema(description = "字符串值.")
	protected String value;

	public WrapString() {
	}

	public WrapString(String value) {
		this.value = value;
	}

	public WrapString(Object o) {
		this.value = Objects.toString(o, "");
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}
}
