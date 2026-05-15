package com.x.base.core.entity.tools;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Gatherers;

import jakarta.persistence.EntityManager;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.entity.JpaObject;

public class EntityManagerContainerTools {

	public static <T extends JpaObject> Integer batchDelete(EntityManagerContainer emc, Class<T> clz, Integer batchSize,
			String... ids) throws Exception {
		List<String> list = Arrays.asList(ids);
		return batchDelete(emc, clz, batchSize, list);
	}

	public static <T extends JpaObject> Integer batchDelete(EntityManagerContainer emc, Class<T> clz, Integer batchSize,
			List<String> ids) throws Exception {
		if (null == batchSize || batchSize < 1 || null == ids || ids.isEmpty()) {
			return 0;
		}
		Integer count = 0;
		EntityManager em = emc.get(clz);
		for (List<String> batch : ids.stream().gather(Gatherers.windowFixed(batchSize)).toList()) {
			em.getTransaction().begin();
			for (String id : batch) {
				T t = em.find(clz, id);
				if (null != t) {
					em.remove(t);
				}
			}
			em.getTransaction().commit();
			count++;
		}
		return count;
	}

}
