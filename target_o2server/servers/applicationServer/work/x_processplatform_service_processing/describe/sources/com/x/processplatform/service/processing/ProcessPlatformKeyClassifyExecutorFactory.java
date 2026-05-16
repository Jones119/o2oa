package com.x.processplatform.service.processing;

import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.StringTools;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.commons.lang3.StringUtils;

public class ProcessPlatformKeyClassifyExecutorFactory {

	private ProcessPlatformKeyClassifyExecutorFactory() {
	}

	private static final Logger LOGGER = LoggerFactory.getLogger(ProcessPlatformKeyClassifyExecutorFactory.class);

	private static final ConcurrentHashMap<String, ExecutorService> pool = new ConcurrentHashMap<>();

	private static volatile int disjointInterval = 20;

	private static final AtomicInteger loop = new AtomicInteger(0);

	public static void init(int coreSize) {
		loop.set(0);
		disjointInterval = coreSize * 2;
	}

	public static void shutdown() {
		pool.values().stream().filter(o -> !o.isShutdown()).forEach(ExecutorService::shutdown);
		pool.clear();
	}

	public static ExecutorService get(String key) {
		if (loop.incrementAndGet() % disjointInterval == 0) {
			disjoint(key);
		}
		key = createUniqueKeyIfBlank(key);
		return pool.computeIfAbsent(key, ProcessPlatformKeyClassifyExecutorFactory::createExecutorService);
	}

	private static void disjoint(String key) {
		Iterator<Map.Entry<String, ExecutorService>> iterator = pool.entrySet().iterator();
		while (iterator.hasNext()) {
			Map.Entry<String, ExecutorService> entry = iterator.next();
			if (!StringUtils.equals(key, entry.getKey()) && entry.getValue().isTerminated()) {
				pool.remove(entry.getKey(), entry.getValue());
				LOGGER.info("disjoint remove ExecutorService: {}.", entry.getKey());
			}
		}
	}

	private static ExecutorService createExecutorService(String key) {
		return Executors.newSingleThreadExecutor(Thread.ofVirtual().name(
				ProcessPlatformKeyClassifyExecutorFactory.class.getName() + "-auxiliary-" + key + "-").factory());
	}

	private static String createUniqueKeyIfBlank(String key) {
		if (StringUtils.isNotBlank(key)) {
			return key;
		} else {
			return StringTools.uniqueToken();
		}
	}

}
