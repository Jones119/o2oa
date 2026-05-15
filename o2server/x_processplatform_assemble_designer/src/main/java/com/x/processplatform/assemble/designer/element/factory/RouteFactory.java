package com.x.processplatform.assemble.designer.element.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.assemble.designer.AbstractFactory;
import com.x.processplatform.assemble.designer.Business;
import com.x.processplatform.core.entity.element.Route;
import com.x.processplatform.core.entity.element.Route_;

public class RouteFactory extends AbstractFactory {

	public RouteFactory(Business business) throws Exception {
		super(business);
	}

	public List<String> listWithProcess(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Route.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Route> root = cq.from(Route.class);
		Predicate p = cb.equal(root.get(Route_.process), processId);
		cq.select(root.get(Route_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public List<Route> listWithProcessObject(String processId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Route.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Route> cq = cb.createQuery(Route.class);
		Root<Route> root = cq.from(Route.class);
		Predicate p = cb.equal(root.get(Route_.process), processId);
		cq.select(root).where(p);
		return em.createQuery(cq).getResultList();
	}
}