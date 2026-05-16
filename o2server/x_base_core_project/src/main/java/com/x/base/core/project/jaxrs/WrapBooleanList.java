package com.x.base.core.project.jaxrs;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.x.base.core.project.gson.GsonRecord;

public class WrapBooleanList implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private List<Boolean> valueList = new ArrayList<>();

	public WrapBooleanList() {
	}

	public WrapBooleanList(Collection<Boolean> collection) {
		this.valueList = new ArrayList<>(collection);
	}

	public List<Boolean> getValueList() {
		return valueList;
	}

	public void setValueList(List<Boolean> valueList) {
		this.valueList = valueList;
	}
}
