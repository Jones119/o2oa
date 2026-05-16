package com.x.base.core.project.jaxrs;

import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = { "/jaxrs/cache/*" }, asyncSupported = true)
public class CacheJaxrsFilter extends CipherManagerJaxrsFilter {

}
