package com.x.base.core.project.jaxrs;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public class WrapNumberList implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private List<Number> valueList = new ArrayList<>();

	public WrapNumberList() {
	}

	public WrapNumberList(Collection<Number> collection) {
		this.valueList = new ArrayList<>(collection);
	}

	public List<Number> getValueList() {
		return valueList;
	}

	public void setValueList(List<Number> valueList) {
		this.valueList = valueList;
	}
}
