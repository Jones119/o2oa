package com.x.organization.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/loginrecord/*", asyncSupported = true)
public class LoginRecordFilter extends CipherManagerJaxrsFilter {

}