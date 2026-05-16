package com.x.file.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/recycle/*", asyncSupported = true)
public class RecycleJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
