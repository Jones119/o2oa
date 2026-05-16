package com.x.portal.assemble.surface.factory;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.base.core.project.cache.Cache.CacheCategory;
import com.x.base.core.project.cache.Cache.CacheKey;
import com.x.base.core.project.cache.CacheManager;
import com.x.portal.assemble.surface.AbstractFactory;
import com.x.portal.assemble.surface.Business;
import com.x.portal.core.entity.Widget;
import com.x.portal.core.entity.Widget_;

public class WidgetFactory extends AbstractFactory {

	static CacheCategory cache = new CacheCategory(Widget.class);

	public WidgetFactory(Business abstractBusiness) throws Exception {
		super(abstractBusiness);
	}

	public Widget pick(String id) throws Exception {
		CacheKey cacheKey = new CacheKey(id);
		Optional<?> optional = CacheManager.get(cache, cacheKey);
		if (optional.isPresent()) {
			return (Widget) optional.get();
		} else {
			Widget o = this.business().entityManagerContainer().find(id, Widget.class);
			if (null != o) {
				this.business().entityManagerContainer().get(Widget.class).detach(o);
				CacheManager.put(cache, cacheKey, o);
				return o;
			}
			return null;
		}
	}

	public List<String> listWithPortal(String portalId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Widget.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Widget> root = cq.from(Widget.class);
		Predicate p = cb.equal(root.get(Widget_.portal), portalId);
		List<String> list = em.createQuery(cq.select(root.get(Widget_.id)).where(p)).getResultList();
		return list;
	}
}