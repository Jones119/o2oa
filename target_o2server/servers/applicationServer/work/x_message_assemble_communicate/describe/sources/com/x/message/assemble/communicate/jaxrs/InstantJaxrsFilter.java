package com.x.message.assemble.communicate.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/instant/*", asyncSupported = true)
public class InstantJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
