package com.x.processplatform.assemble.surface.factory.content;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.processplatform.assemble.surface.AbstractFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.SerialNumber;
import com.x.processplatform.core.entity.content.SerialNumber_;
import com.x.processplatform.core.entity.element.Application;

public class SerialNumberFactory extends AbstractFactory {

	public SerialNumberFactory(Business abstractBusiness) throws Exception {
		super(abstractBusiness);
	}

	public List<String> listWithApplication(Application application) throws Exception {
		EntityManager em = this.entityManagerContainer().get(SerialNumber.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<SerialNumber> root = cq.from(SerialNumber.class);
		Predicate p = cb.equal(root.get(SerialNumber_.application), application.getId());
		cq.select(root.get(SerialNumber_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public List<String> listWithApplication(String id) throws Exception {
		EntityManager em = this.entityManagerContainer().get(SerialNumber.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<SerialNumber> root = cq.from(SerialNumber.class);
		Predicate p = cb.equal(root.get(SerialNumber_.application), id);
		cq.select(root.get(SerialNumber_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

	public List<String> listWithProcess(String id) throws Exception {
		EntityManager em = this.entityManagerContainer().get(SerialNumber.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<SerialNumber> root = cq.from(SerialNumber.class);
		Predicate p = cb.equal(root.get(SerialNumber_.process), id);
		cq.select(root.get(SerialNumber_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

}