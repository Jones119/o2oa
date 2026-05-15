package com.x.program.init;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

@WebListener
public class ApplicationServletContextListener implements ServletContextListener {

	@Override
	public void contextInitialized(ServletContextEvent servletContextEvent) {
		ThisApplication.init();
		ThisApplication.path = servletContextEvent.getServletContext().getRealPath("");
	}

	@Override
	public void contextDestroyed(ServletContextEvent servletContextEvent) {
		ThisApplication.destroy();
	}

}