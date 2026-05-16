package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = { "/describe/*" }, asyncSupported = true)
public class DescribeFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
