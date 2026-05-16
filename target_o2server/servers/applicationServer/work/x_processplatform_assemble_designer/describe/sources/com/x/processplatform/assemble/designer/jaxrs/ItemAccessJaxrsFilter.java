package com.x.processplatform.assemble.designer.jaxrs;

import com.x.base.core.project.jaxrs.ManagerUserJaxrsFilter;
import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/item-access/*", asyncSupported = true)
public class ItemAccessJaxrsFilter extends ManagerUserJaxrsFilter {

}
