package com.x.message.assemble.communicate.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/mass/*", asyncSupported = true)
public class MassJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
