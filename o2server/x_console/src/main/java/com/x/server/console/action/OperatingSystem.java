package com.x.server.console.action;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;

import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

public class OperatingSystem extends Thread {

	private static final Logger LOGGER = LoggerFactory.getLogger(OperatingSystem.class);

	private Integer count;

	public OperatingSystem(int count) {
		this.count = count;
	}

	@Override
	public void run() {
		OperatingSystemMXBean bean = ManagementFactory.getOperatingSystemMXBean();
		try {
			for (int i = 0; i < count; i++) {
				if (bean instanceof com.sun.management.OperatingSystemMXBean sunBean) {
					String msg = String.format(
							"cpu:%d, system load:%.2f, process load:%.2f. memory:%dm, free:%dm, committed virtual:%dm.",
							sunBean.getAvailableProcessors(), sunBean.getSystemCpuLoad(), sunBean.getProcessCpuLoad(),
							sunBean.getTotalPhysicalMemorySize() / (1024 * 1024),
							sunBean.getFreePhysicalMemorySize() / (1024 * 1024),
							sunBean.getCommittedVirtualMemorySize() / (1024 * 1024));
					LOGGER.print(msg);
				} else {
					String msg = String.format("cpu:%d, system load average:%.2f.",
							bean.getAvailableProcessors(), bean.getSystemLoadAverage());
					LOGGER.print(msg);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}