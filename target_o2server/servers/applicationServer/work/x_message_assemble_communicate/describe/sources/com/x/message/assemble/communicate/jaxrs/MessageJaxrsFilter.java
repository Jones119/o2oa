package com.x.message.assemble.communicate.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/message/*", asyncSupported = true)
public class MessageJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
