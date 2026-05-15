package com.x.organization.assemble.authentication.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns =  "/jaxrs/bind/*" ,asyncSupported=true)
public class BindJaxrsFilter extends CipherManagerJaxrsFilter {

}
