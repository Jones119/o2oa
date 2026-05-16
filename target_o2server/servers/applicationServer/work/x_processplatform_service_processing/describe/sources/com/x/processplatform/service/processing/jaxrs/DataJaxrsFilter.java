package com.x.processplatform.service.processing.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/data/*", asyncSupported = true)
public class DataJaxrsFilter extends CipherManagerJaxrsFilter {

}
