package com.x.processplatform.assemble.designer.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/applicationcategory/*", asyncSupported = true)
public class ApplicationCategoryJaxrsFilter extends ManagerUserJaxrsFilter {

}
