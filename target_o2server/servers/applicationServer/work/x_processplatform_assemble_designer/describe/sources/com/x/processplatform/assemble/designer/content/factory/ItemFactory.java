package com.x.processplatform.assemble.designer.content.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.base.core.entity.dataitem.ItemCategory;
import com.x.processplatform.assemble.designer.AbstractFactory;
import com.x.processplatform.assemble.designer.Business;
import com.x.query.core.entity.Item;
import com.x.query.core.entity.Item_;

public class ItemFactory extends AbstractFactory {

	public ItemFactory(Business business) throws Exception {
		super(business);
	}

	public List<Item> listObjectWithJob(String job) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Item.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<Item> cq = cb.createQuery(Item.class);
		Root<Item> root = cq.from(Item.class);
		Predicate p = cb.equal(root.get(Item_.bundle), job);
		p = cb.and(p, cb.equal(root.get(Item_.itemCategory), ItemCategory.pp));
		cq.select(root).where(p);
		return em.createQuery(cq).getResultList();
	}

}