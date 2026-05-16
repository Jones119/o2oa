package com.x.base.core.project.jaxrs;

import java.util.Date;

import com.x.base.core.project.gson.GsonRecord;

public class WrapDate implements GsonRecord {

	private static final long serialVersionUID = 1L;

	private Date date;

	public WrapDate() {
	}

	public WrapDate(Date date) {
		this.date = date;
	}

	public Date getDate() {
		return date;
	}

	public void setDate(Date date) {
		this.date = date;
	}
}
