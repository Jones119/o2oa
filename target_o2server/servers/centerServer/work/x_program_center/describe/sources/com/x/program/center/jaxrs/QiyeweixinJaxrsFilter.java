package com.x.program.center.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.AnonymousCipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/qiyeweixin/*", asyncSupported = true)
public class QiyeweixinJaxrsFilter extends AnonymousCipherManagerUserJaxrsFilter {

}
