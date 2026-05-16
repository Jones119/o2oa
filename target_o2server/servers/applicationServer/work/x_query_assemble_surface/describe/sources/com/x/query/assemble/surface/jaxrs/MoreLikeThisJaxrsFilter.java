package com.x.query.assemble.surface.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/morelikethis/*", asyncSupported = true)
public class MoreLikeThisJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
