package com.x.file.assemble.control.jaxrs;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;
import jakarta.servlet.annotation.WebFilter;

@WebFilter(urlPatterns = "/jaxrs/file/*", asyncSupported = true)
public class FileJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
