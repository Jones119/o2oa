package com.x.general.assemble.control.jaxrs;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;
import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/invoice/*", asyncSupported = true)
public class InvoiceJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
