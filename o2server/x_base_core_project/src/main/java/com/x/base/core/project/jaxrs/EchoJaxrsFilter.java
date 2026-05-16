package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = { "/jaxrs/echo/*" }, asyncSupported = true)
public class EchoJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
