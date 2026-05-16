package com.x.jpush.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/message/*", asyncSupported = true)
public class JpushMessageJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
