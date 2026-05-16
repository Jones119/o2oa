package com.x.file.assemble.control.jaxrs;

import jakarta.servlet.annotation.WebFilter;

import com.x.base.core.project.jaxrs.CipherManagerUserJaxrsFilter;

@WebFilter(urlPatterns = "/jaxrs/folder/*",asyncSupported = true)
public class FolderJaxrsFilter extends CipherManagerUserJaxrsFilter {

}
