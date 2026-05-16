package com.x.processplatform.assemble.surface.factory.element;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.element.Application;
import com.x.processplatform.core.entity.element.ApplicationDict;
import com.x.processplatform.core.entity.element.ApplicationDict_;

public class ApplicationDictFactory extends ElementFactory {

	public ApplicationDictFactory(Business abstractBusiness) throws Exception {
		super(abstractBusiness);
	}

	public List<String> listWithApplication(Application application) throws Exception {
		EntityManager em = this.entityManagerContainer().get(ApplicationDict.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<ApplicationDict> root = cq.from(ApplicationDict.class);
		Predicate p = cb.equal(root.get(ApplicationDict_.application), application.getId());
		cq.select(root.get(ApplicationDict_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public String getWithApplicationWithUniqueName(String application, String uniqueName) throws Exception {
		EntityManager em = this.entityManagerContainer().get(ApplicationDict.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<ApplicationDict> root = cq.from(ApplicationDict.class);
		Predicate p = cb.equal(root.get(ApplicationDict_.name), uniqueName);
		p = cb.or(p, cb.equal(root.get(ApplicationDict_.alias), uniqueName));
		p = cb.or(p, cb.equal(root.get(ApplicationDict_.id), uniqueName));
		p = cb.and(p, cb.equal(root.get(ApplicationDict_.application), application));
		cq.select(root.get(ApplicationDict_.id)).where(p);
		List<String> list = em.createQuery(cq).setMaxResults(1).getResultList();
		return list.isEmpty() ? null : list.get(0);
	}
}